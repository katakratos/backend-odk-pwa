import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollecteDocument = Collecte & Document;

@Schema({ timestamps: true })
export class Collecte {
  // id généré côté PWA (S.rec.id) : sert de clé d'upsert pour éviter les doublons
  // si l'agent renvoie le même dossier après une coupure réseau.
  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop()
  agent: string;

  @Prop()
  ref: string;

  @Prop()
  today: string;

  @Prop()
  start: string;

  @Prop()
  end: string;

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
      accuracy: Number,
      timestamp: Number,
    },
  })
  positionGps: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy: number;
    timestamp: number;
  };

  // Références vers les documents fs.files du bucket GridFS "photos_cni"
  @Prop({ type: Types.ObjectId })
  cniRectoFileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  cniVersoFileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  photoClientCniFileId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  signatureFileId: Types.ObjectId;
}

export const CollecteSchema = SchemaFactory.createForClass(Collecte);
