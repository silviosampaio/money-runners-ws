import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Challenge = new Schema({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatório'],
  },
  fee: {
    type: Number,
    required: [true, 'Taxa é obrigatório'],
  },
  distance: {
    type: Number,
    required: [true, 'Distância é obrigatório'],
  },
  ytVideoId: {
    type: String,
    required: [true, 'Vídeo do Youtube é obrigatório'],
  },
  time: {
    start: {
      type: String,
      required: [true, 'Horário de início é obrigatório'],
    },
    end: {
      type: String,
      required: [true, 'Horário de fim é obrigatório'],
    },
  },
  date: {
    start: {
      type: String,
      required: [true, 'Data de início é obrigatório'],
    },
    end: {
      type: String,
      required: [true, 'Data de fim é obrigatório'],
    },
  },
  status: {
    type: String,
    enum: ['A', 'I', 'F'], // ACTIVE, INACTIVE, FINISHED
    default: 'A',
  },
  register: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Challenge', Challenge);
