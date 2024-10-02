import { useEffect, useRef, useState } from 'react';
import useDraggableScroll from 'use-draggable-scroll';

export default function AppFooter({ items }) {
    const navRef = useRef<HTMLDivElement>(null);
    const { onMouseDown } = useDraggableScroll(navRef);
    const [elementWidth, setElementWidth] = useState<string>('');

    /**
     * @handleResize функция Измененте ширины элементов меню
     * navRef.current.clientWidth общая ширина текущего меню в зависимости от ширины экрана
     * 31 - сумма гэпов между элементами и паддингов
     * (navWidth -31)/7 ширина одного элемента, которую нужно отнять от общей ширины, чтобы получилось так, что последний элемент виден на половину
     */
    function handleResize() {
        setElementWidth(`${((navRef?.current?.clientWidth - (navRef?.current?.clientWidth - 31) / 7) / 7).toString()}px`);
    }

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        if (navRef.current === null) return;
        const dragElement = navRef.current.getBoundingClientRect();
        if (dragElement.left < 0) {
            navRef.current.scrollBy(-10, 0);
        }
        if (dragElement.right > window.innerWidth) {
            navRef.current.scrollBy(10, 0);
        }
    }, [navRef]);

    return (
        <div id="apelsin-app-footer">
            <div
                ref={navRef}
                onMouseDown={onMouseDown}
                className="nav-menu"
                style={
                    items.length == 3
                        ? { justifyContent: 'center' }
                        : { justifyContent: 'space-between' }
                }
            >
                {items.map((item) => {
                    return (
                        <div key={item.key} className="menu-content" onClick={item.onClick}>
                            <div
                                className={`${item.disabled ? 'menu-item-disabled' : 'menu-item'}`}
                                style={{ width: elementWidth }}
                            >
                                {item.icon}
                            </div>
                            <span className="menu-text">{item.title}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
