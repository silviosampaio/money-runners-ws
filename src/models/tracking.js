import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const Tracking = new Schema({
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
  transactionId: {
    type: String,
    required: [
      function () {
        // FEE, WITHDRAWAL
        return ['F', 'W'].includes(this.operation);
      },
      'ID da Transação é obrigatório',
    ],
  },
  operation: {
    type: String,
    enum: ['F', 'G', 'L', 'W'], //FEE, GAIN, LOSS, WITHDRAWAL
    required: [true, 'Tipo é obrigatório'],
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
  },
  register: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Tracking', Tracking);
