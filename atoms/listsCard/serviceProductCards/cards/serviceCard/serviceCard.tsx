import { Common } from '@classes/commonMethods';
import { GlobalConstants } from '@constants/global';
import { faCheck, faClock, faRubleSign } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Typography, Image, InputNumber } from 'antd';
import { SyntheticEvent } from 'react';
import cn from 'classnames';
import { TService } from 'types/service';
import { TServiceCategory } from 'types/serviceCategory';
import { columnViewStore } from '@molecules/listViewChanger/listViewStore';

import styles from './serviceCard.module.scss';
import { rootStore } from '@store/rootStore/instanse';
import { normalizeOrderService } from 'types/Orders/services';
import { CardQuantityStore } from '@store/cardQuantityStore';
import { useLocalStore } from '@utils/useLocalStore';

const { Text, Paragraph } = Typography;

type Props = {
    data: TService & { category: TServiceCategory };
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

function ServiceCard({
    data,
    selecting,
    selectElemList,
    openCard,
    handleProductSelectButtonClick,
}: Props) {
    const store = useLocalStore(
        () => new CardQuantityStore(data.id, rootStore.orderStore.services[data.id]?.quantity || 0)
    );

    const handleSelectCard = (e: SyntheticEvent) => {
        handleProductSelectButtonClick(e, data.id, data.name, data.category?.id);
        store.setVisible(true);
        store.inc();
        rootStore.orderStore.updateServicesList(normalizeOrderService(data, store.quantity));
    };
    const handlePlusClick = (e: SyntheticEvent) => {
        e.stopPropagation();
        store.inc();
        rootStore.orderStore.updateServicesList(normalizeOrderService(data, store.quantity));
    };
    const handleMinusClick = (e: SyntheticEvent) => {
        e.stopPropagation();
        store.dec();
        rootStore.orderStore.updateServicesList(normalizeOrderService(data, store.quantity));
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
            </div>
            <div className={styles['card__info']} onClick={() => openCard(data.id)}>
                <Paragraph className={styles['card__name']} ellipsis={{ rows: 2 }}>
                    {data.name}
                </Paragraph>
                <div className={styles['card__duration']}>
                    <FontAwesomeIcon icon={faClock} />
                    <Text>{Common.convertM2H(data.duration)}</Text>
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
                            <InputNumber controls={false} value={store.quantity} min={0} />
                            <Button onClick={handlePlusClick} type="primary">
                                +
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export { ServiceCard };
