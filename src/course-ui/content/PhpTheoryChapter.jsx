import { EditorialChapter, EditorialChapterSection } from './EditorialChapter.jsx';
import styles from './content.module.css';

export default function PhpTheoryChapter({ children, intro, title }) {
  return (
    <EditorialChapter intro={intro}>
      <EditorialChapterSection index={1} title={title}>
        <div className={styles.phpTheoryStack}>{children}</div>
      </EditorialChapterSection>
    </EditorialChapter>
  );
}
