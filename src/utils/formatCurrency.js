export const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return 'Rp 0';
  }

  return parseFloat(value).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default formatCurrency;
