// Contact page animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}

export const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
}

export const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5
    }
  },
  hover: {
    scale: 1.02,
    y: -3,
    transition: {
      duration: 0.3
    }
  }
}

export const backgroundAnimations = {
  circle1: {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 180, 360],
    },
    transition: {
      duration: 20,
      repeat: Infinity
    }
  },
  circle2: {
    animate: {
      scale: [1.2, 1, 1.2],
      rotate: [360, 180, 0],
    },
    transition: {
      duration: 25,
      repeat: Infinity
    }
  },
  circle3: {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.7, 0.3],
    },
    transition: {
      duration: 15,
      repeat: Infinity
    }
  }
}
