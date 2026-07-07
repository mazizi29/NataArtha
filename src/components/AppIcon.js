import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../styles/globalStyles';

const iconPaths = {
  dashboard: [
    'M4 13h7V4H4v9Z',
    'M13 20h7v-9h-7v9Z',
    'M4 20h7v-5H4v5Z',
    'M13 9h7V4h-7v5Z',
  ],
  history: [
    'M3 12a9 9 0 1 0 3-6.7',
    'M3 4v6h6',
    'M12 7v5l3 2',
  ],
  add: ['M12 5v14', 'M5 12h14'],
  income: ['M7 17 17 7', 'M9 7h8v8'],
  expense: ['M7 7l10 10', 'M17 9v8H9'],
  logout: ['M15 17l5-5-5-5', 'M20 12H9', 'M12 19H5V5h7'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  user: [
    'M20 21a8 8 0 0 0-16 0',
    'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  ],
  mail: [
    'M4 6h16v12H4V6Z',
    'm4 8 8 6 8-6',
  ],
  lock: [
    'M7 11V8a5 5 0 0 1 10 0v3',
    'M6 11h12v10H6V11Z',
  ],
  eye: [
    'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  eyeOff: [
    'M3 3l18 18',
    'M10.6 10.6A3 3 0 0 0 13.4 13.4',
    'M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.4',
    'M6.4 6.4C3.6 8.1 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.1-.8',
  ],
  calendar: [
    'M7 3v4',
    'M17 3v4',
    'M4 8h16',
    'M5 5h14v16H5V5Z',
  ],
  tag: [
    'M20 13 13 20 4 11V4h7l9 9Z',
    'M8 8h.01',
  ],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'm20 20-4-4'],
  refresh: ['M21 12a9 9 0 0 1-15.4 6.4L3 16', 'M3 21v-5h5', 'M3 12A9 9 0 0 1 18.4 5.6L21 8', 'M21 3v5h-5'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M6 6l1 15h10l1-15', 'M10 11v6', 'M14 11v6'],
  chevronRight: ['M9 18l6-6-6-6'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
};

const AppIcon = ({
  name,
  size = 20,
  color = colors.muted,
  strokeWidth = 2,
  style,
}) => {
  const paths = iconPaths[name] || iconPaths.dashboard;

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
      {paths.map((d) => (
        <Path
          key={d}
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

export default AppIcon;
