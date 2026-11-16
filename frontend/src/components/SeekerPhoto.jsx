import { NoPhoto } from './ListingCard';

export default function SeekerPhoto({ src }) {
  return <div className="lcard__media">{src ? <img src={src} alt="" loading="lazy" /> : <NoPhoto />}</div>;
}
