import { observer } from 'mobx-react';
import { GlobalConstants } from '@constants/global';
import { faCheck, faRubleSign } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Typography, Image, InputNumber } from 'antd';
import { SyntheticEvent } from 'react';
import cn from 'classnames';
import { TProduct } from 'types/product';
import { TProductCategory } from 'types/productCategory';
import { columnViewStore } from '@molecules/listViewChanger/listViewStore';

import styles from './productCard.module.scss';
import { useLocalStore } from '@utils/useLocalStore';
import { CardQuantityStore } from '@store/cardQuantityStore';
import { rootStore } from '@store/rootStore/instanse';
import { normalizeOrderProduct } from 'types/Orders/products';

const { Text, Paragraph } = Typography;

type Props = {
    data: TProduct & { category: TProductCategory };
    selecting: boolean;
    selectElemList: Array<{ id: number; name: string; parentId: number | null }>;
    openCard: (id: number) => void | null;
    handleProductSelectButtonClick: (
        e: SyntheticEvent,
        categoryId: number,
        categoryName: string,
        parentId: number | null
    ) => void | null;
};

const ProductCard = observer(
    ({ data, selecting, selectElemList, openCard, handleProductSelectButtonClick }: Props) => {
        const store = useLocalStore(
            () =>
                new CardQuantityStore(
                    data.id,
                    rootStore.orderStore.products[data.id]?.quantity || 0,
                    data.quantity
                )
        );

        const handleSelectCard = (e: SyntheticEvent) => {
            handleProductSelectButtonClick(e, data.id, data.name, data.category?.id);
            store.setVisible(true);
            store.inc();
            rootStore.orderStore.updateProductList(normalizeOrderProduct(data, store.quantity));
        };
        const handlePlusClick = () => {
            store.inc();
            rootStore.orderStore.updateProductList(normalizeOrderProduct(data, store.quantity));
        };
        const handleMinusClick = (e: SyntheticEvent) => {
            store.dec();
            rootStore.orderStore.updateProductList(normalizeOrderProduct(data, store.quantity));
            if (!store.controlsIsVisible) {
                handleProductSelectButtonClick(e, data.id, data.name, data.category?.id);
            }
        };

        return (
            <div
                className={cn(styles.card, {
                    [styles['card_vertical']]: columnViewStore.col > 1,
                })}
            >
                <div
                    className={cn(styles['card__image-container'], {
                        [styles['card__image-container_vertical']]: columnViewStore.col > 1,
                    })}
                >
                    <Image src={`${GlobalConstants.BaseUrlForImg}${data?.picture as string}`} />
                    <span className={styles['card__quantity']}>{`(${data.quantity})`}</span>
                </div>
                <div className={styles['card__info']} onClick={() => openCard(data.id)}>
                    <Paragraph ellipsis={{rows: 2}}>{data.name}</Paragraph>
                    <div>
                        {'Арт. '}{' '}
                        <Typography.Text
                            copyable={{
                                tooltips: ['копировать', 'скопировано'],
                            }}
                        >
                            {data.artnumber}
                        </Typography.Text>
                    </div>
                    <Text className={styles['card__price-container']}>
                        <span className={styles['card__price']}>{data.price}</span>{' '}
                        <FontAwesomeIcon icon={faRubleSign} />
                    </Text>
                </div>
                {selecting && (
                    <div className={cn(styles['card__select-btn'])}>
                        {!store.controlsIsVisible ? (
                            <Button
                                onClick={handleSelectCard}
                                icon={<FontAwesomeIcon icon={faCheck} />}
                                shape="circle"
                                type={
                                    selectElemList.find((sli) => sli.id == data.id)
                                        ? 'primary'
                                        : 'default'
                                }
                            />
                        ) : (
                            <div className={styles['card__controls']}>
                                <Button onClick={handleMinusClick} type="primary">
                                    -
                                </Button>
                                <InputNumber
                                    controls={false}
                                    value={store.quantity}
                                    min={0}
                                    max={data.quantity}
                                />
                                <Button onClick={handlePlusClick} type="primary">
                                    +
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

export { ProductCard };
