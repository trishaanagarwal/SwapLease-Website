import { ImageOff } from 'lucide-react';
import { t } from '../theme';

export default function SeekerPhoto({ src, height = 200 }) {
  if (src) return <img src={src} alt="" style={{ width: '100%', height, objectFit: 'cover' }} />;
  return (
    <div style={{ width: '100%', height, background: t.creamDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.inkFaint }}>
      <ImageOff size={height < 180 ? 24 : 28} />
    </div>
  );
}
