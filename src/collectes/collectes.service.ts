import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, mongo } from 'mongoose';
import { Collecte, CollecteDocument } from './schemas/collecte.schema';

type ObjectId = mongo.ObjectId;
type GridFSBucket = mongo.GridFSBucket;

interface File {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

interface UploadedPhotos {
  cni_recto: File[];
  cni_verso: File[];
  photo_client_cni: File[];
  signature_acceptation: File[];
}

@Injectable()
export class CollectesService {
  private bucket: GridFSBucket;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Collecte.name) private collecteModel: Model<CollecteDocument>,
  ) {
    // Un seul bucket "photos_cni" -> crée les collections photos_cni.files
    // et photos_cni.chunks dans la même base Mongo que le reste de l'appli.
    this.bucket = new mongo.GridFSBucket(this.connection.db, {
      bucketName: 'photos_cni',
    });
  }

  private storeFile(file: File, filename: string): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(filename, {
        contentType: file.mimetype,
      });
      uploadStream.end(file.buffer);
      uploadStream.on('finish', () => resolve(uploadStream.id as ObjectId));
      uploadStream.on('error', reject);
    });
  }

  async create(meta: any, files: UploadedPhotos) {
    const [cniRectoId, cniVersoId, photoClientId, signatureId] = await Promise.all([
      this.storeFile(files.cni_recto[0], `${meta.id}_cni_recto.jpg`),
      this.storeFile(files.cni_verso[0], `${meta.id}_cni_verso.jpg`),
      this.storeFile(files.photo_client_cni[0], `${meta.id}_photo_client_cni.jpg`),
      this.storeFile(files.signature_acceptation[0], `${meta.id}_signature.png`),
    ]);

    // upsert sur clientId : si l'agent renvoie deux fois le même dossier
    // (ex. coupure réseau juste après un premier envoi réussi côté serveur),
    // on met à jour au lieu de dupliquer.
    return this.collecteModel.findOneAndUpdate(
      { clientId: meta.id },
      {
        clientId: meta.id,
        agent: meta.agent,
        ref: meta.ref,
        today: meta.today,
        start: meta.start,
        end: meta.end,
        positionGps: meta.position_gps,
        cniRectoFileId: cniRectoId,
        cniVersoFileId: cniVersoId,
        photoClientCniFileId: photoClientId,
        signatureFileId: signatureId,
      },
      { upsert: true, new: true },
    );
  }

  findAll() {
    return this.collecteModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.collecteModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Dossier introuvable');
    return doc;
  }

  // Utilisé par le contrôleur pour streamer un fichier directement dans la réponse HTTP,
  // sans jamais l'écrire sur le disque du serveur.
  openDownloadStream(fileId: string) {
    return this.bucket.openDownloadStream(new mongo.ObjectId(fileId));
  }

  async deleteRecord(id: string) {
    const doc = await this.findOne(id);
    const ids = [doc.cniRectoFileId, doc.cniVersoFileId, doc.photoClientCniFileId, doc.signatureFileId];
    await Promise.all(ids.filter(Boolean).map((fid) => this.bucket.delete(new mongo.ObjectId(fid.toString()))));
    await this.collecteModel.deleteOne({ _id: id });
  }
}
