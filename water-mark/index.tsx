import { classNames } from '@dimjs/utils';
import { fbmUtils, NativeProps } from '@flatbiz/mobile';
import { hooks } from '@wove/react';
import {
  CSSProperties,
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import './index.less';

interface WaterMarkProps extends NativeProps {
  /**
   * 是否展示水印
   * @desc 若 markText 或 markUrl 字段为空值（根据type字段判断），则不会渲染水印区域
   * @default true
   */
  visible?: boolean;
  /**
   * 水印类型，支持文字类型(text)和图片类型(image)两种形式的水印
   * @default 'text'
   */
  type?: 'text' | 'image';
  /**
   * 水印文本
   * @desc type='text' 时有效
   */
  markText?: string;
  /**
   * 水印图片链接
   * @desc type='image' 时有效
   */
  markUrl?: string;
  /**
   * 水印图片加载失败时展示的默认文字
   * @desc type='image' 时有效
   */
  markImageAlt?: string;
  /**
   * 水印图片尺寸，格式 [宽度，高度]（单位px）
   * @desc type='image' 时有效。用于自动计算需要生成的水印个数
   * @default [70,40]
   */
  markImageSize?: [number, number];
  /**
   * 水印文字的单字符尺寸，格式 [宽度，高度]（单位px）
   * @desc type='text' 时有效。用于自动计算需要生成的水印个数
   * @default [10,20]
   */
  markCharacterSize?: [number, number];

  /**
   * 水印数量，格式 [一行渲染多少个，一列渲染多少个]）
   * @desc 哪个位置为空就会自动计算对应位置的数量
   */
  markCount?: [number | undefined, number | undefined];
  /**
   * 水印内容最大间距，格式 [行间距，列间距]（单位px）
   * @desc 实际渲染时，内容间距会进行特殊处理，以避免内容排列过于整齐
   * @default [80,100]
   */
  markContentGap?: [number, number];
  /**
   * 水印内容最大偏移量，格式 [行间距，列间距]（单位px）
   * @desc 实际渲染时，内容间距会进行特殊处理，以避免内容排列过于整齐
   * @default [80,100]
   */
  markContentOffset?: [number, number];
  /**
   * 增加计算出的水印个数，格式 [行个数，列个数]（单位px）
   * @desc 水印旋转后，水印区域的边角可能会出现无水印情况，此时就可以手动增加水印个数。
   * （不建议增加过多的水印，在页面内容过多或页面过于复杂的情况下，过多的 DOM 元素可能会进一步影响页面体验和性能）
   * @default [3,2]
   */
  markContentAppend?: [number, number];
  /**
   * 自动监听水印区域尺寸的变化
   * @desc !!!注意!!!，此功能使用的API为实验型功能，由于浏览器支持率较高（>90%），所以组件内置了此API的功能使用。
   * 如果你需要手动计算水印区域的大小，可以在业务中使用通过自定义 ref 提供的 reCountWatermarkArea 方法。
   * @default true
   */
  observerResize?: boolean;

  /**
   * 水印每行数据的自定义定位，格式 [top值，left值]）
   * @desc 哪个位置为空就会自动计算对应位置的数量
   */
  markRowPosition?: [number | undefined, number | undefined];
  /**
   * 水印区域的定位方式
   * @default 'absolute'
   */
  position?: CSSProperties['position'];
  /**
   * 水印区域的透明度
   * @default 0.15
   */
  opacity?: CSSProperties['opacity'];
  /**
   * 自定义行className
   * @default 'watermark__row'
   */
  rowClassName?: string;
  /**
   * 自定义列className
   * @default 'watermark__col'
   */
  colClassName?: string;
}

export interface WaterMarkRef {
  reCountWatermarkArea: () => void;
}

const WatermarkCom: ForwardRefRenderFunction<WaterMarkRef, WaterMarkProps> = (props, ref) => {
  const {
    visible = true,
    type = 'text',
    markText = '',
    markUrl,
    markImageAlt = '',
    markImageSize = [70, 40],
    markCharacterSize = [10, 20],

    markCount = [],
    markContentGap = [80, 100],
    markContentOffset = [20, 20],
    markContentAppend = [3, 2],
    observerResize = true,

    markRowPosition = [],
    position = 'absolute',
    opacity = 0.15,
    rowClassName,
    colClassName,
  } = props;
  const [rowList, setRowList] = useState<number[]>([]);
  const [colList, setColList] = useState<number[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const isImageWatermark = type === 'image';
  const needVisible = visible && (isImageWatermark ? !!markUrl : !!markText);

  const [imageWidth, imageHeight] = markImageSize;
  const [rowGap, colGap] = markContentGap;
  const [rowOffsetNum, colOffsetNum] = markContentOffset;
  const [rowTopValue, rowLeftValue] = markRowPosition;

  hooks.useModelEffect(() => {
    handleReCount();
  });

  hooks.useUpdateEffect(() => {
    handleReCount();
  }, [needVisible, wrapperRef]);

  const handleReCount = () => {
    const wrapper = wrapperRef.current;

    if (!needVisible || !wrapper) {
      return;
    }

    let rowList: number[] = [];
    let colList: number[] = [];

    const [rowLength, colLength] = markCount;

    const { width, height } = wrapper.getBoundingClientRect();

    const [characterWidth, characterHeight] = markCharacterSize;
    const [rowAppendNum, colAppendNum] = markContentAppend;

    const colWidth = isImageWatermark ? imageWidth : characterWidth * markText.length;
    const colHeight = isImageWatermark ? imageHeight : characterHeight;

    const rowCount = height / (colHeight + rowGap) + rowAppendNum;
    const colCount = width / (colWidth + colGap) + colAppendNum;

    rowList = new Array(rowLength ?? Math.ceil(rowCount)).fill(1);
    colList = new Array(colLength ?? Math.ceil(colCount)).fill(1);

    setRowList(rowList);
    setColList(colList);
  };

  hooks.useUpdateEffect(() => {
    if (!observerResize || !wrapperRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      handleReCount();
    });

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, [observerResize, wrapperRef.current]);

  useImperativeHandle(ref, () => ({
    reCountWatermarkArea: handleReCount,
  }));

  if (!needVisible) {
    return null;
  }

  return fbmUtils.withNativeProps(
    props,
    <div ref={wrapperRef} className="watermark" style={{ position, opacity }}>
      {rowList.map((_, rowIndex) => (
        <p
          key={rowIndex}
          className={classNames('watermark__row', rowClassName)}
          style={{
            marginBottom: `${rowGap}px`,
            left: rowLeftValue ?? `-${colOffsetNum + colGap}px`,
            top: rowTopValue ?? `-${rowOffsetNum + rowGap}px`,
          }}
        >
          {colList.map((_, colIndex) => {
            const offsetStyle = {
              marginLeft: rowIndex % 2 === 0 ? `${colGap}px` : 0,
              marginRight: rowIndex % 2 === 1 ? `${colGap}px` : 0,
            };

            return isImageWatermark ? (
              <img
                key={colIndex}
                src={markUrl}
                alt={markImageAlt}
                className={classNames('watermark__col watermark__img', colClassName)}
                style={{
                  width: `${imageWidth}px`,
                  height: `${imageHeight}px`,
                  ...offsetStyle,
                }}
              />
            ) : (
              <span
                key={colIndex}
                className={classNames('watermark__col watermark__text', colClassName)}
                style={offsetStyle}
              >
                {markText}
              </span>
            );
          })}
        </p>
      ))}
    </div>,
  );
};

/**
 * 设置一个水印区域
 */
export const Watermark = forwardRef(WatermarkCom);
