import { Spin } from "antd";
import { LoadingOutlined } from '@ant-design/icons';

type TProps = {
    isFullSize?: boolean;
};

const circleIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Loader = ({ isFullSize = true }: TProps): JSX.Element => (
    <Spin size={"large"} indicator={circleIcon} className={`apelsin-loader ${isFullSize ? "full" : ""}`} />
);

export { Loader };
