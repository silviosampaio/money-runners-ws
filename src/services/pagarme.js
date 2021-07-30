import axios from 'axios';
import { api_key } from '../data/keys.js';

const api = axios.create({
  baseURL: 'https://api.pagar.me/1',
});

export default async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, {
      api_key,
      ...data,
    });

    return { error: false, data: response.data };
  } catch (err) {
    return {
      error: true,
      message: JSON.stringify(err.response.data.errors[0]),
    };
  }
};
