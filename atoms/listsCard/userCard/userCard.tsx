import { TUser } from 'types/user';
import { Button, Image, Typography } from 'antd';
import cn from 'classnames';
import styles from './userCard.module.scss';
import { GlobalConstants } from '@constants/global';
import { columnViewStore } from '@molecules/listViewChanger/listViewStore';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const { Paragraph } = Typography;

type Props = {
    handleUserClick: (userId: number, userFirstName: string, userLastName: string) => void;
    selecting: boolean;
    selectList: {
        id: number;
        name: string;
    }[];
    user: TUser;
};

const UserCard = ({ user, handleUserClick, selectList, selecting }: Props) => {
    return (
        <div
            className={cn(styles.card, {
                [styles['card_vertical']]: columnViewStore.col > 1,
            })}
        >
            <div className={styles['card__image']}>
                <Image src={`${GlobalConstants.BaseUrlForImg}${user?.picture as string}`} />
            </div>
            <div
                className={styles['card__info']}
                onClick={() => handleUserClick(user.id, user.name, user.surname)}
            >
                <Paragraph ellipsis={{ rows: 1 }}>{`${user.name} ${user.surname}`}</Paragraph>
                <Paragraph ellipsis={{ rows: 1 }}>
                    {user.profile?.name ?? 'Тестовая группа/Тестовый профиль'}
                </Paragraph>
                {selecting && (
                <div className={styles['card__select-btn']}>
                    <Button
                        icon={<FontAwesomeIcon icon={faCheck} />}
                        shape="circle"
                        type={selectList.find((sli) => sli.id == user.id) ? 'primary' : 'default'}
                    />
                </div>
            )}
            </div>
        </div>
    );
};

export { UserCard };