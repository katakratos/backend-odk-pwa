import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Res,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CollectesService } from './collectes.service';

interface File {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

class CollecteMetaDto {
  @ApiProperty({ example: 'test-1' })
  id: string;

  @ApiProperty({ example: 'Paule' })
  agent: string;

  @ApiProperty({ example: 'Test' })
  ref: string;

  @ApiProperty({ example: '2026-09-29' })
  today: string;

  @ApiProperty({ example: '2026-09-29T10:00:00Z' })
  start: string;

  @ApiProperty({ example: '2026-09-29T10:05:00Z' })
  end: string;

  @ApiProperty({
    type: 'object',
    example: {
      latitude: 3.87,
      longitude: 11.52,
      accuracy: 10,
      timestamp: 1234567890,
    },
  })
  position_gps: any;
}

type Files = {
  cni_recto?: File[];
  cni_verso?: File[];
  photo_client_cni?: File[];
  signature_acceptation?: File[];
};

@Controller('collectes')
@ApiTags('collectes')
export class CollectesController {
  constructor(private readonly collectesService: CollectesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un dossier de collecte' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CollecteMetaDto,
    description: 'Données du dossier + 4 fichiers',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cni_recto', maxCount: 1 },
        { name: 'cni_verso', maxCount: 1 },
        { name: 'photo_client_cni', maxCount: 1 },
        { name: 'signature_acceptation', maxCount: 1 },
      ],
      {
        limits: { fileSize: 8 * 1024 * 1024 },
      },
    ),
  )
  async create(@Body('data') data: string, @UploadedFiles() files: Files) {
    if (!data) throw new BadRequestException('Champ "data" manquant');
    const meta = JSON.parse(data);

    if (
      !files.cni_recto?.[0] ||
      !files.cni_verso?.[0] ||
      !files.photo_client_cni?.[0] ||
      !files.signature_acceptation?.[0]
    ) {
      throw new BadRequestException('Un ou plusieurs fichiers sont manquants');
    }

    return this.collectesService.create(meta, files as any);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les dossiers' })
  findAll() {
    return this.collectesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un dossier par ID' })
  findOne(@Param('id') id: string) {
    return this.collectesService.findOne(id);
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: 'Télécharger un fichier (photo, CNI, signature)' })
  getFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const stream = this.collectesService.openDownloadStream(fileId);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un dossier' })
  remove(@Param('id') id: string) {
    return this.collectesService.deleteRecord(id);
  }
}
