import express from 'express';
import mongoose from 'mongoose';
import Busboy from 'busboy';
import bcrypt from 'bcrypt';
import moment from 'moment';

import aws from '../services/aws.js';
import pagarme from '../services/pagarme.js';

import User from '../models/user.js';
import Challenge from '../models/challenge.js';
import UserChallenge from '../models/relationship/userChallenge.js';
import Tracking from '../models/tracking.js';

const router = express.Router();

router.post('/', async (req, res) => {
  var busboy = new Busboy({ headers: req.headers });
  busboy.on('finish', async () => {
    console.log(req.body);

    try {
      // UPLOAD ALL FILES
      let errors = [];
      const userId = mongoose.Types.ObjectId();
      let photo = '';

      if (req.files) {
        const file = req.files.photo;

        const nameParts = file.name.split('.');
        const fileName = `${userId}.${nameParts[nameParts.length - 1]}`;
        photo = `user/${fileName}`;

        const response = await aws.uploadToS3(
          file,
          photo
          //, acl = https://docs.aws.amazon.com/pt_br/AmazonS3/latest/dev/acl-overview.html
        );

        if (response.error) {
          errors.push({ error: true, message: response.message.message });
        }
      }

      // SE ERRO, ABORTA TUDO
      if (errors.length > 0) {
        res.json(errors[0]);
        return false;
      }

      // CRIAR SENHA COM BCRYPT
      const password = await bcrypt.hash(req.body.password, 10);

      const user = await new User({
        ...req.body,
        _id: userId,
        password,
        photo,
      }).save();

      res.json({ user });
    } catch (err) {
      res.json({ error: true, message: err.message });
    }
  });
  req.pipe(busboy);
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
      status: 'A',
    });

    if (!user) {
      res.json({ error: true, message: 'Nenhum e-mail ativo encontrado.' });
      return false;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.json({
        error: true,
        message: 'Combinação errada de E-mail / Senha.',
      });
      return false;
    }

    delete user.password;

    res.json({
      user,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/:id/challenge', async (req, res) => {
  try {
    // RECUPERAR DESAFIO ATUAL
    // CRONJOB CUIDARÁ DO STATUS
    const challenge = await Challenge.findOne({
      status: 'A',
    });

    if (!challenge) {
      res.json({ error: true, message: 'Nenhum desafio ativo.' });
      return false;
    }

    // VERIFICAR SE O USUÁRIO ESTÁ NELE
    const userChallenge = await UserChallenge.findOne({
      userId: req.params.id,
      challengeId: challenge._id,
    });

    // VERIFICAR VALOR DIÁRIO
    const dayStart = moment(challenge.date.start, 'YYYY-MM-DD');
    const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD');
    const challengePeriod = dayEnd.diff(dayStart, 'days');
    const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days');

    const dailyAmount = challenge.fee / challengePeriod;

    // VERIFICAR QUANTAS VEZES ELE PARTICIPOU
    const participatedTimes = await Tracking.find({
      operation: 'G',
      userId: req.params.id,
      challengeId: challenge._id,
    });

    // CALCULAR SALDO CONQUISTADO
    const balance = participatedTimes.length * dailyAmount;

    // CALCULAR SE JÁ FEZ O DESAFIO HOJE
    const challengeFinishedToday = await Tracking.findOne({
      userId: req.params.id,
      challengeId: challenge._id,
      register: {
        $lte: moment().endOf('day'),
        $gte: moment().startOf('day'),
      },
      operation: {
        $in: ['G', 'L'],
      },
    });

    // CALCULAR A DISCIPLINA
    const periodDiscipline = Boolean(challengeFinishedToday)
      ? currentPeriod
      : currentPeriod - 1;
    const discipline = participatedTimes?.length / periodDiscipline;

    // RECUPERANDO TODOS OS RESULTADOS DO DIA
    const dailyResults = await Tracking.find({
      challengeId: challenge._id,
      register: {
        $lte: moment().endOf('day'),
        $gte: moment().startOf('day'),
      },
      operation: {
        $in: ['G', 'L'],
      },
    })
      .populate('userId', 'name photo')
      .select('userId amount operation');

    res.json({
      challenge,
      isParticipant: Boolean(userChallenge),
      dailyAmount,
      challengePeriod,
      participatedTimes: participatedTimes?.length,
      discipline,
      balance,
      challengeFinishedToday: Boolean(challengeFinishedToday),
      currentPeriod,
      dailyResults,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/:id/accept', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    const pagarmeUser = await pagarme('/customers', {
      external_id: userId,
      name: user.name,
      type: 'individual',
      country: 'br',
      email: user.email,
      documents: [
        {
          type: 'cpf',
          number: user.cpf,
        },
      ],
      phone_numbers: ['+55' + user.phone],
      birthday: user.birthday,
    });

    if (pagarmeUser.error) {
      throw pagarmeCliente;
    }

    await User.findByIdAndUpdate(userId, {
      customerId: pagarmeUser.data.id,
      status: 'A',
    });

    // ENVIAR PUSH NOTIFICATION
    res.json({ message: 'Usuário aceito na plataforma' });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

router.get('/:id/balance', async (req, res) => {
  try {
    const userId = req.params.id;

    const records = await Tracking.find({
      userId,
    }).sort([['register', -1]]);

    const balance = records
      .filter((t) => t.operation === 'G')
      .reduce((total, t) => {
        return total + t.amount;
      }, 0);

    // ENVIAR PUSH NOTIFICATION
    res.json({
      records,
      balance,
    });
  } catch (err) {
    res.json({ error: true, message: err.message });
  }
});

export default router;
