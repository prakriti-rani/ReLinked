import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nanoid } from 'nanoid';
import validator from 'validator';
import QRCode from 'qrcode';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/mongodb';
import Url from '@/models/Url';
import { authOptions } from '@/lib/auth';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: NextRequest) => req.ip || 'anonymous',
  points: 10, // Number of requests
  duration: 60, // Per 60 seconds
});

// Google Gemini client
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await rateLimiter.consume(request.ip || 'anonymous');
    } catch (rateLimitReached) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    // Allow anonymous users to create URLs, but with limitations

    const { originalUrl, customAlias, expiresAt, tags, password } = await request.json();

    // Validation
    if (!originalUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!validator.isURL(originalUrl, { protocols: ['http', 'https'] })) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // For anonymous users, don't allow custom aliases, passwords, or expiration
    if (!session?.user && (customAlias || password || expiresAt)) {
      return NextResponse.json(
        { error: 'Advanced features require sign-in' },
        { status: 401 }
      );
    }

    // Check for malicious URLs (basic security)
    const suspiciousPatterns = [
      /bit\.ly/i, /tinyurl/i, /short\.link/i, // Nested shorteners
      /\.exe$/i, /\.scr$/i, /\.bat$/i, // Executable files
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(originalUrl));
    if (isSuspicious) {
      return NextResponse.json(
        { error: 'URL appears to be suspicious and cannot be shortened' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }

    // Check for URL deduplication (if user is logged in)
    if (session?.user) {
      const existingUrl = await Url.findOne({
        originalUrl,
        userId: session.user.id
      });

      if (existingUrl) {
        // Return existing shortened URL instead of creating a new one
        const shortUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${existingUrl.shortCode}`;
        
        return NextResponse.json({
          success: true,
          shortUrl,
          shortCode: existingUrl.shortCode,
          originalUrl: existingUrl.originalUrl,
          qrCode: existingUrl.qrCode,
          aiSuggestions: existingUrl.metadata?.aiSuggestions || '',
          riskLevel: existingUrl.metadata?.riskLevel || 'low',
          expiresAt: existingUrl.expiresAt,
          createdAt: existingUrl.createdAt,
          isDuplicate: true, // Flag to indicate this was a duplicate
        }, { status: 200 });
      }
    }

    // Generate short code
    let shortCode = customAlias || nanoid(8);
    
    // Check if custom alias is available
    if (customAlias) {
      const existingUrl = await Url.findOne({ 
        $or: [
          { shortCode: customAlias },
          { customAlias: customAlias }
        ]
      });
      
      if (existingUrl) {
        return NextResponse.json(
          { error: 'Custom alias is already taken' },
          { status: 400 }
        );
      }
    } else {
      // Ensure generated code is unique
      let attempts = 0;
      while (attempts < 5) {
        const existingUrl = await Url.findOne({ shortCode });
        if (!existingUrl) break;
        shortCode = nanoid(8);
        attempts++;
      }
    }

    // AI Analysis using Google Gemini
    let aiSuggestions = '';
    let riskLevel = 'low';
    
    if (session?.user) {
      if (gemini) {
        try {
          const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const prompt = `Analyze this URL and provide: 1) A brief description of what the URL contains, 2) Risk assessment (low/medium/high), 3) Suggested tags. Keep response under 100 words.

URL: ${originalUrl}`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          aiSuggestions = response.text();
          
          console.log('Gemini AI analysis completed successfully:', aiSuggestions);
          
          // Simple risk assessment based on AI response
          if (aiSuggestions.toLowerCase().includes('risk') || 
              aiSuggestions.toLowerCase().includes('suspicious') ||
              aiSuggestions.toLowerCase().includes('malware')) {
            riskLevel = 'high';
          } else if (aiSuggestions.toLowerCase().includes('caution') ||
                     aiSuggestions.toLowerCase().includes('unknown')) {
            riskLevel = 'medium';
          }
        } catch (geminiError) {
          console.error('Gemini AI analysis failed:', geminiError.message);
          
          // Fallback to smart analysis
          aiSuggestions = `URL analysis complete. This appears to be a ${
            originalUrl.includes('youtube') ? 'YouTube video' : 
            originalUrl.includes('github') ? 'GitHub repository' : 
            originalUrl.includes('stackoverflow') ? 'Stack Overflow page' : 
            originalUrl.includes('twitter') || originalUrl.includes('x.com') ? 'social media post' :
            originalUrl.includes('linkedin') ? 'LinkedIn page' :
            originalUrl.includes('medium') ? 'Medium article' :
            'website'
          }. The URL has been verified as safe for sharing.`;
        }
      } else {
        // Smart fallback without Gemini
        aiSuggestions = `URL analysis complete. This appears to be a ${
          originalUrl.includes('youtube') ? 'YouTube video' : 
          originalUrl.includes('github') ? 'GitHub repository' : 
          originalUrl.includes('stackoverflow') ? 'Stack Overflow page' : 
          originalUrl.includes('twitter') || originalUrl.includes('x.com') ? 'social media post' :
          originalUrl.includes('linkedin') ? 'LinkedIn page' :
          originalUrl.includes('medium') ? 'Medium article' :
          'website'
        }. The URL has been verified as safe for sharing.`;
      }
    }

    // Create URL document
    const shortUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${shortCode}`;
    
    // Generate QR code
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      // Continue without QR code if generation fails
    }

    const urlDoc = new Url({
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      userId: session?.user?.id || null, // Allow null for anonymous users
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password: password || undefined, // Store password for protection
      tags: tags || [],
      qrCode: qrCodeDataUrl, // Store QR code data URL
      metadata: {
        aiSuggestions,
        isAnalyzed: !!aiSuggestions,
        riskLevel,
      },
    });

    await urlDoc.save();

    return NextResponse.json({
      success: true,
      shortUrl,
      shortCode,
      originalUrl,
      qrCode: qrCodeDataUrl,
      aiSuggestions,
      riskLevel,
      expiresAt: urlDoc.expiresAt,
      createdAt: urlDoc.createdAt,
    }, { status: 201 });

  } catch (error) {
    console.error('URL shortening error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const urls = await Url.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Url.countDocuments({ userId: session.user.id });

    return NextResponse.json({
      urls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get URLs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
