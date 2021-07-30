export default {
  toCents: (price) => {
    return parseInt(price.toString().replace('.', '').replace(',', ''));
  },
};
