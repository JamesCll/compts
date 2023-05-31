import { classNames } from '@dimjs/utils';
import { withNativeProps } from '@shared/types/native-props';
import { isUndefinedOrNull } from '@shared/utils/common';
import React, { HTMLAttributes, useEffect, useRef, useState } from 'react';
import './styles/index';
interface IBtaAnimateProps {
  children: React.ReactNode;
  /** 需要指定单位 % px 不支持rem */
  offset?: string;
  className?: string;
  /** 队列执行动画间隔时间 */
  interval?: number;
  type?: 'up' | 'down' | 'left' | 'right' | 'up-bounce' | 'down-bounce';
  /** 动画幅度 默认15% */
  range?: number;
  /** 动画时间 默认 1000ms 单位ms */
  time?: number;
}

export const BtaAnimate = ({
  children,
  offset = '0px',
  className: originClassName,
  interval,
  type,
  range,
  time,
}: IBtaAnimateProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setInView(true);
        }
      },
      {
        rootMargin: offset,
      },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const newChildren = addClassNameToChildren({
    children,
    inView,
    interval,
    type,
  });

  return withNativeProps(
    {
      style: {
        '--bta-animate-z-range': !range ?? String(range) + '%',
        '--bta-animate-f-range': !range ?? '-' + String(range) + '%',
        '--bta-animate-time': time ? String(time) + 'ms' : '',
      },
    },
    <div ref={ref} className={originClassName}>
      {newChildren}
    </div>,
  );
};

const addClassNameToChildren = (props: {
  children: React.ReactNode;
  inView: boolean;
  interval?: number;
  type?: IBtaAnimateProps['type'];
}): React.ReactNode => {
  const { children, inView, interval, type } = props;

  const length = (children as Array<any>)?.length;
  return React.Children.map(children, (child, idx) => {
    if (React.isValidElement(child)) {
      const props = { ...child.props } as HTMLAttributes<HTMLDivElement>;

      if (inView) {
        const animateType = (props['data-animate'] || type) as string;
        const cls = props.className?.replace('bta-animate-hide', '');
        const aniCls = animateType ? 'bta-animated bta-animate__fadein-' + animateType : '';
        props.className = classNames(cls, aniCls);

        const delay = interval
          ? length === 1
            ? String(interval) + 'ms'
            : String(interval * idx) + 'ms'
          : '';

        if (!isUndefinedOrNull(interval)) {
          props.style = {
            ...props.style,
            animationDelay: delay,
          };
        }

        delete props['data-animate'];
      } else {
        props.className = classNames(props.className, 'bta-animate-hide');
      }
      return React.cloneElement(child, props);
    }
    return child;
  });
};
