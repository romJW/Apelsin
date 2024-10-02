import { Button } from 'antd';

type TProps = {
    text: string,
    onClick: () => Promise<void>
};

const ShowMoreButton = ({ text, onClick }: TProps): JSX.Element => {
    return (
        <Button className="show-more-btn round-btn" onClick={onClick} type="primary">
            {text}
        </Button>
    );
};

export { ShowMoreButton };