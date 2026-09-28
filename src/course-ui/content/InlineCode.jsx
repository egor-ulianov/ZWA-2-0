import styles from './content.module.css';

export default function InlineCode({ children }) {
  return <code className={styles.inlineCode}>{children}</code>;
}
