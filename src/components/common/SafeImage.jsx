/**
 * <SafeImage>: wrapper de <img> que pasa el src por resolveFileUrl().
 *
 * Sirve para mostrar URLs guardadas en la BD que pueden venir como path
 * relativo (/api/files/...) tanto en local como en Railway, sin acoplar
 * el dominio del backend. Acepta blobs, data URIs y URLs absolutas sin
 * tocarlas — resolveFileUrl() solo prefija las que empiezan con "/".
 *
 * Uso:
 *   <SafeImage src={user.avatar} alt="..." className="..." />
 *
 * Es 100% compatible con <img>: pasa cualquier prop adicional al elemento.
 */
import PropTypes from 'prop-types';
import { resolveFileUrl } from '../../utils/fileUrl';

const SafeImage = ({ src, ...rest }) => {
  return <img src={resolveFileUrl(src)} {...rest} />;
};

SafeImage.propTypes = {
  src: PropTypes.string
};

export default SafeImage;
