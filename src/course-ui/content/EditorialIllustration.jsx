import Image from 'next/image';

import styles from './content.module.css';

export default function EditorialIllustration({ alt, height = 1024, src, width = 1536 }) {
  return (
    <figure className={styles.editorialFigure} data-editorial-illustration="true">
      <Image
        alt={alt}
        height={height}
        sizes="(max-width: 52rem) calc(100vw - 2rem), 52rem"
        src={src}
        width={width}
      />
    </figure>
  );
}
