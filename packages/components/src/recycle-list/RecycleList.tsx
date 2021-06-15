import * as React from 'react';
import { FixedSizeList, VariableSizeList } from 'react-window';
import { ScrollbarsVirtualList } from '../scrollbars';
import AutoSizer from 'react-virtualized-auto-sizer';
import * as cls from 'classnames';

export interface IRecycleListProps {
  /**
   * 容器高度
   * height 计算出可视区域渲染数量
   * @type {number}
   * @memberof RecycleTreeProps
   */
  height?: number;
  /**
   * 容器宽度
   * height 计算出可视区域渲染数量
   * @type {number}
   * @memberof RecycleTreeProps
   */
  width?: number;
  /**
   * 节点高度
   * @type {number}
   * @memberof RecycleTreeProps
   */
  itemHeight?: number;
  /**
   * List外部样式
   * @type {React.CSSProperties}
   * @memberof RecycleListProps
   */
  style?: React.CSSProperties;
  /**
   * List外部样式名
   * @type {string}
   * @memberof RecycleListProps
   */
  className?: string;
  /**
   * List数据源
   * @type {any[]}
   * @memberof IRecycleListProps
   */
  data: any[];
  /**
   * 基础数据源渲染模板
   * 默认传入参数为：(data, index) => {}
   * data 为 this.props.data中的子项
   * index 为当前下标
   * @type {React.ComponentType<any>}
   * @memberof IRecycleListProps
   */
  template: React.ComponentType<any>;
  /**
   * 头部组件渲染模板
   * 默认传入参数为：() => {}
   * @type {React.ComponentType<any>}
   * @memberof IRecycleListProps
   */
  header?: React.ComponentType<any>;
  /**
   * 底部组件渲染模板
   * 默认传入参数为：() => {}
   * @type {React.ComponentType<any>}
   * @memberof IRecycleListProps
   */
  footer?: React.ComponentType<any>;
  /**
   * 处理 RecycleList API回调
   * @memberof IRecycleListProps
   */
  onReady?: (api: IRecycleListHandler) => void;
}

export interface IRecycleListHandler {
  scrollTo: (offset: number) => void;
  scrollToIndex: (index: number) => void;
}

export const RECYCLE_LIST_STABILIZATION_TIME: number = 500;

export const RecycleList: React.FC<IRecycleListProps> = ({
  width, height, className, style, data, onReady, itemHeight, header: Header, footer: Footer, template: Template,
}) => {

  const listRef = React.useRef<FixedSizeList>();
  const sizeMap = React.useRef<{ [key: string]: number }>({});
  const scrollToIndexTimer = React.useRef<any>();

  React.useEffect(() => {
    if (typeof onReady === 'function') {
      const api = {
        scrollTo: (offset: number) => {
          listRef.current?.scrollTo(offset);
        },
        // custom alignment: center, start, or end
        scrollToIndex: (index: number, position: string = 'start') => {
          let locationIndex = index;
          if (!!Header) {
            locationIndex++;
          }
          if (typeof itemHeight === 'number') {
            listRef.current?.scrollTo(locationIndex * (itemHeight), position);
          } else {
            if (scrollToIndexTimer.current) {
              clearTimeout(scrollToIndexTimer.current);
            }
            const keys = sizeMap.current ? Object.keys(sizeMap.current) : [];
            const offset = keys.slice(0, locationIndex).reduce((p, i) => p + getSize(i), 0);
            listRef.current?.scrollToItem(index, position);
            // 在动态列表情况下，由于渲染抖动问题，可能需要再渲染后尝试再进行一次滚动位置定位
            scrollToIndexTimer.current = setTimeout(() => {
              const keys = sizeMap.current ? Object.keys(sizeMap.current) : [];
              const nextOffset = keys.slice(0, locationIndex).reduce((p, i) => p + getSize(i), 0);
              if (nextOffset !== offset) {
                listRef.current?.scrollToItem(index, position);
              }
              scrollToIndexTimer.current = null;
            }, RECYCLE_LIST_STABILIZATION_TIME);
          }
        },
      };
      onReady(api);
    }
  }, []);

  const setSize = (index: number, size: number) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current = { ...sizeMap.current, [index]: size };
      if (listRef.current) {
        // 清理缓存数据并重新渲染
        listRef.current?.resetAfterIndex(0);
      }
    }
  };

  const getSize = (index: string | number) => {
    return (sizeMap?.current || [])[index] || 100;
  };

  const adjustedRowCount = React.useMemo(() => {
    let count = data.length;
    if (!!Header) {
      count++;
    }
    if (!!Footer) {
      count++;
    }
    return count;
  }, [data]);

  const renderItem = ({ index, style }): JSX.Element => {
    let node;
    if (index === 0) {
      if (Header) {
        return <div style={style}>
          <Header />
        </div>;
      }
    }
    if ((index + 1) === adjustedRowCount) {
      if (!!Footer) {
        return <div style={style}>
          <Footer />
        </div>;
      }
    }
    if (!!Header) {
      node = data[index - 1];
    } else {
      node = data[index];
    }
    if (!node) {
      return <div style={style}></div>;
    }

    // ref: https://developers.google.com/web/fundamentals/accessibility/semantics-aria/aria-labels-and-relationships
    const ariaInfo = {
      'aria-setsize': adjustedRowCount,
      'aria-posinset': index,
    };

    return <div style={style} role='listitem' {...ariaInfo}>
      <Template data={node} index={index} />
    </div>;
  };

  const renderDynamicItem = ({ index, style }): JSX.Element => {
    const rowRoot = React.useRef<null | HTMLDivElement>(null);
    const observer = React.useRef<any>();
    const setItemSize = () => {
      if (rowRoot.current) {
        let height = 0;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < rowRoot.current.children.length; i++) {
          height += rowRoot.current.children[i].getBoundingClientRect().height;
        }
        setSize(index, height);
      }
    };
    React.useEffect(() => {
      if (rowRoot.current && listRef.current) {
        observer.current = new MutationObserver((mutations, observer) => {
          setItemSize();
        });
        const observerOption = {
          childList: true, // 子节点的变动（新增、删除或者更改）
          attributes: true, // 属性的变动
          characterData: true, // 节点内容或节点文本的变动

          subtree: true, // 是否将观察器应用于该节点的所有后代节点
          attributeFilter: ['class', 'style'], // 观察特定属性
          attributeOldValue: true, // 观察 attributes 变动时，是否需要记录变动前的属性值
          characterDataOldValue: true, // 观察 characterData 变动，是否需要记录变动前的值
        };
        // 监听子节点属性变化
        observer.current.observe(rowRoot.current, observerOption);
        setItemSize();
      }
      return () => {
        observer.current.disconnect();
      };
    }, [rowRoot.current]);
    let node;
    if (index === 0) {
      if (Header) {
        return <div style={style}>
          <Header />
        </div>;
      }
    }
    if ((index + 1) === adjustedRowCount) {
      if (!!Footer) {
        return <div style={style}>
          <Footer />
        </div>;
      }
    }
    if (!!Header) {
      node = data[index - 1];
    } else {
      node = data[index];
    }
    if (!node) {
      return <div style={style}></div>;
    }

    return <div style={style} ref={rowRoot}>
      <Template data={node} index={index} />
    </div>;
  };

  const getItemKey = (index: number) => {
    const node = data[index];
    if (node && node.id) {
      return node.id;
    }
    return index;
  };

  // 通过计算平均行高来提高准确性
  // 修复滚动条行为，见: https://github.com/bvaughn/react-window/issues/408
  const calcEstimatedSize = () => {
    const keys = sizeMap.current ? Object.keys(sizeMap.current) : [];
    const estimatedHeight = keys.reduce((p, i) => p + getSize(i), 0);
    return estimatedHeight / keys.length;
  };

  const render = () => {
    const isDynamicList = typeof itemHeight !== 'number';
    const isAutoSizeList = !width || !height;

    const renderList = () => {
      let List;
      if (!isDynamicList) {
        List = FixedSizeList;
      } else {
        List = VariableSizeList;
      }

      const renderContent = ({ width, height }) => {
        if (isDynamicList) {
          return <List
            width={width}
            height={height}
            // 这里的数据不是必要的，主要用于在每次更新列表
            itemData={[]}
            itemSize={getSize}
            itemCount={adjustedRowCount}
            getItemKey={getItemKey}
            overscanCount={10}
            ref={listRef}
            style={style}
            className={cls(className, 'kt-recycle-list')}
            outerElementType={ScrollbarsVirtualList}
            estimatedItemSize={calcEstimatedSize()}>
            {renderDynamicItem}
          </List>;
        } else {
          return <List
            width={width}
            height={height}
            // 这里的数据不是必要的，主要用于在每次更新列表
            itemData={[]}
            itemSize={itemHeight}
            itemCount={adjustedRowCount}
            getItemKey={getItemKey}
            overscanCount={10}
            ref={listRef}
            style={style}
            className={cls(className, 'kt-recycle-list')}
            outerElementType={ScrollbarsVirtualList}>
            {renderItem}
          </List>;
        }
      };

      if (!isAutoSizeList) {
        return renderContent({ width, height });
      } else {
        return <AutoSizer>
          {renderContent}
        </AutoSizer>;
      }
    };

    return renderList();
  };

  return render();
};
