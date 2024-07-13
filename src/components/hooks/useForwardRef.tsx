import { ForwardedRef, useRef, useEffect } from "react";


const useForwardRef = <T,>(
  ref: ForwardedRef<T>,
  initialValue: T | null = null
) => {
  const targetRef = useRef<T>(initialValue);

  useEffect(() => {
    console.log(ref);
    if (!ref) return;

    if (typeof ref === 'function') {
      ref(targetRef.current);
    } else {
      ref.current = targetRef.current;
    }
  }, [ref]);

  return targetRef;
};

export default useForwardRef;
