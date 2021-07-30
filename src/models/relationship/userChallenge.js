import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserChallenge = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório'],
  },
  challengeId: {
    type: mongoose.Types.ObjectId,
    ref: 'Challenge',
    required: [true, 'Desafio é obrigatório'],
  },
  register: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('UserChallenge', UserChallenge);
