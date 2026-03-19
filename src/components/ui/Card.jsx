import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -2 } : undefined}
      className={`glass-card motioncore-card relative overflow-hidden p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}