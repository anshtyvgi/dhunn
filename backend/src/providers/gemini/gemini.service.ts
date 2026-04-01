import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateDedicateDto,
  LyricPreviewOptionDto,
} from '../../modules/generate/dto/create-dedicate.dto';

interface GeminiVariant {
  title: string;
  vibe: string;
  lyrics: string;
  tags: string[];
  coverPrompt: string;
}

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly textModel: string;
  private readonly imageModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('geminiApiKey');
    this.textModel = this.configService.getOrThrow<string>('geminiTextModel');
    this.imageModel = this.configService.getOrThrow<string>('geminiImageModel');
  }

  async generateLyricVariants(input: CreateDedicateDto) {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: this.buildLyricsPrompt(input),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.95,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(this.buildTextEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Gemini lyric generation failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as Record<string, any>;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new InternalServerErrorException(
        'Gemini returned an empty lyric payload',
      );
    }

    let parsed: { globalTags?: string[]; variants: GeminiVariant[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Attempt to repair truncated JSON by closing open structures
      let repaired = text.trim();
      // Strip trailing incomplete string values
      repaired = repaired.replace(/,\s*"[^"]*$/, '');
      repaired = repaired.replace(/,\s*$/, '');
      // Close open arrays/objects
      const opens = (repaired.match(/[\[{]/g) ?? []).length;
      const closes = (repaired.match(/[\]}]/g) ?? []).length;
      for (let i = 0; i < opens - closes; i++) {
        repaired += repaired.lastIndexOf('[') > repaired.lastIndexOf('{') ? ']' : '}';
      }
      try {
        parsed = JSON.parse(repaired);
      } catch {
        throw new InternalServerErrorException(
          'Gemini returned malformed JSON for lyric variants',
        );
      }
    }

    const variants = parsed.variants?.slice(0, 3);
    if (!variants || variants.length !== 3) {
      throw new InternalServerErrorException(
        'Gemini must return exactly 3 lyric variants',
      );
    }

    return {
      globalTags: parsed.globalTags ?? [],
      variants: variants.map((variant, index) => ({
        ...variant,
        tags: variant.tags ?? [],
        variantIndex: index,
      })),
    };
  }

  async generateLyricPreview(input: CreateDedicateDto) {
    const generated = await this.generateLyricVariants(input);

    return generated.variants.map((variant) => ({
      title: variant.title,
      vibe: variant.vibe,
      lyrics: variant.lyrics,
      tags: variant.tags.join(', '),
      coverPrompt: variant.coverPrompt,
    }));
  }

  normalizePreviewOptions(options: LyricPreviewOptionDto[]) {
    return options.slice(0, 3).map((variant, index) => ({
      variantIndex: index,
      title: variant.title,
      vibe: variant.vibe,
      lyrics: variant.lyrics,
      tags: variant.tags,
      coverPrompt:
        variant.coverPrompt ??
        `Create premium album art for "${variant.title}" with a ${variant.vibe} mood.`,
    }));
  }

  async generateCoverImage(params: {
    title: string;
    vibe: string;
    coverPrompt: string;
  }) {
    const response = await fetch(this.buildImageEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: [
                  'Create a premium music cover image.',
                  `Title: ${params.title}`,
                  `Vibe: ${params.vibe}`,
                  params.coverPrompt,
                  'Square composition, cinematic, emotionally resonant, no text overlay.',
                ].join('\n'),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Gemini cover generation failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as Record<string, any>;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const inlineData = parts.find(
      (part: Record<string, any>) =>
        part.inlineData?.mimeType && part.inlineData?.data,
    )?.inlineData;

    if (!inlineData?.data) {
      throw new InternalServerErrorException(
        'Gemini returned no image bytes for the cover',
      );
    }

    return {
      buffer: Buffer.from(inlineData.data, 'base64'),
      mimeType: inlineData.mimeType as string,
    };
  }

  private buildTextEndpoint() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.textModel}:generateContent?key=${this.apiKey}`;
  }

  private buildImageEndpoint() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.imageModel}:generateContent?key=${this.apiKey}`;
  }

  private buildLyricsPrompt(input: CreateDedicateDto) {
    return `
You are Dhun's senior creative director for personalized music.
Generate exactly 3 commercially viable dedication song variants.

Return strict JSON with this shape:
{
  "globalTags": ["tag-1", "tag-2"],
  "variants": [
    {
      "title": "string",
      "vibe": "2-4 word vibe",
      "lyrics": "lyrics with [Verse], [Chorus], [Bridge]",
      "tags": ["tag-a", "tag-b", "tag-c"],
      "coverPrompt": "visual direction for premium album art"
    }
  ]
}

Rules:
- Personalized for ${input.recipientName}
- Occasion: ${input.occasion}
- Relationship: ${input.relationship}
- Mood: ${input.mood}
- Genre: ${input.genre}
- Language: ${input.language}
- Voice: ${input.voice}
- Message to weave in: ${input.message || 'Create a heartfelt emotional story.'}
- Each variant must feel meaningfully different in narrative angle, imagery, and musical energy
- Lyrics must be between 150 and 250 words
- Tags must be concise production descriptors usable for audio generation
- Cover prompt should describe an evocative square music artwork with no text
    `.trim();
  }
}
