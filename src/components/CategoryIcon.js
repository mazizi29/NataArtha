import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../styles/globalStyles';

// Menyimpan path SVG untuk tiap kategori
// Menggunakan desain outline yang elegan dan seragam (Lucide-inspired)
const categoryPaths = {
  // PENGELUARAN (Expense)
  'Makanan': [
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
    'M7 2v20',
    'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7'
  ],
  'Minuman': [
    'M18 8h1a4 4 0 0 1 0 8h-1',
    'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
    'M6 2v3',
    'M10 2v3',
    'M14 2v3'
  ],
  'Jajan': [
    'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5',
    'M8.5 8.5v.01',
    'M16 15.5v.01',
    'M12 12v.01',
    'M11 17v.01',
    'M7 14v.01'
  ],
  'Transportasi': [
    'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
    'M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
    'M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0'
  ],
  'Hiburan': [
    'M6 12h4', 'M8 10v4', 'M15 13h.01', 'M18 11h.01',
    'M5 8h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2Z'
  ],
  'Kesehatan': [
    'M22 12h-4l-3 9L9 3l-3 9H2'
  ],
  'Belanja': [
    'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z',
    'M3 6h18',
    'M16 10a4 4 0 0 1-8 0'
  ],
  'Tagihan': [
    'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z',
    'M16 10h-8',
    'M16 14h-8',
    'M10 6h-2'
  ],
  'Pendidikan': [
    'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'
  ],
  'Asuransi': [
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'
  ],
  'Pinjaman': [
    'M21 12V7H5a2 2 0 0 1 0-4h14v4',
    'M3 5v14a2 2 0 0 0 2 2h16v-5',
    'M18 12a2 2 0 0 0 0 4h4v-4Z'
  ],

  // PEMASUKAN (Income)
  'Gaji': [
    'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
    'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'
  ],
  'Tabungan': [
    'M3 5c0 1.6 4 3 9 3s9-1.4 9-3-4-3-9-3-9 1.4-9 3Z',
    'M3 5v14c0 1.6 4 3 9 3s9-1.4 9-3V5',
    'M3 12c0 1.6 4 3 9 3s9-1.4 9-3'
  ],
  'Bonus': [
    'M20 12v8H4v-8', 'M2 7h20v5H2z', 'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'
  ],
  'Investasi': [
    'M22 7 13.5 13.5 8.5 8.5 2 15',
    'M16 7h6v6'
  ],
  'Usaha': [
    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M9 22V12h6v10'
  ],
  'Hadiah': [
    'M20 12v8H4v-8', 'M2 7h20v5H2z', 'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'
  ],
  'Freelance': [
    'M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9',
    'M2 16h20',
    'M12 20h.01'
  ],
  'Sewa': [
    'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'
  ],
  'Dividen': [
    'M21.21 15.89A10 10 0 1 1 8 2.83',
    'M22 12A10 10 0 0 0 12 2v10z'
  ],
  'Pengembalian': [
    'M9 10 4 15 9 20',
    'M20 4v7a4 4 0 0 1-4 4H4'
  ],

  // ICONS UMUM UNTUK KUSTOM
  'Star': [
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  ],
  'Heart': [
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'
  ],
  'Smile': [
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    'M8 14s1.5 2 4 2 4-2 4-2',
    'M9 9h.01',
    'M15 9h.01'
  ],
  'Zap': [
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
  ],
  'Camera': [
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  ],
  'Gift': [
    'M20 12v8H4v-8', 'M2 7h20v5H2z', 'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'
  ],
  'Shopping Cart': [
    'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
    'M9 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
    'M20 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0z'
  ],
  'Home': [
    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M9 22V12h6v10'
  ],
  'Car': [
    'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
    'M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
    'M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0'
  ],
  'Coffee': [
    'M18 8h1a4 4 0 0 1 0 8h-1',
    'M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z',
    'M6 2v3',
    'M10 2v3',
    'M14 2v3'
  ],
  'Briefcase': [
    'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
    'M2 14h20',
    'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'
  ],
  'Monitor': [
    'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z',
    'M8 21h8',
    'M12 17v4'
  ],
  'Book': [
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
    'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'
  ],
  'TrendingUp': [
    'M23 6l-9.5 9.5-5-5L1 18',
    'M17 6h6v6'
  ],
  // DEFAULT (Lainnya)
  'Lainnya': [
    'M12 12h.01',
    'M19 12h.01',
    'M5 12h.01'
  ],
};

const CategoryIcon = ({
  category,
  iconName,
  size = 20,
  color = colors.white,
  strokeWidth = 2,
  style,
}) => {
  // Jika tidak menemukan kategori, gunakan 'Lainnya' sebagai default fallback
  const paths = categoryPaths[iconName] || categoryPaths[category] || categoryPaths['Lainnya'];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {paths.map((d, i) => (
        <Path
          key={`${d}-${i}`}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
};

export default CategoryIcon;
