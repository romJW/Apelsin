import React, { useRef, useState } from 'react';
import { Col, Row, Radio, RadioChangeEvent } from 'antd';
import Cropper from 'react-cropper';
import { GlobalConstants } from '../../../constants/global';
import { throttle } from '../../../utils/functions';

type TProps = {
    img: string;
    handleOnCrop: (img: string) => void;
};

const ImgCropper = ({ img, handleOnCrop }: TProps) => {
    const [cropper, setCropper] = useState<Cropper>();
    const cropperRef = useRef<HTMLImageElement>(null);
    const [ratio, setRatio] = useState(1 / 1);

    const handleChange = (e: RadioChangeEvent) => {
        cropper.setAspectRatio(e.target.value);
        setRatio(e.target.value);
    };

    const setMinSize = (e) => {
        const width = e.detail.width;
        const height = e.detail.height;
        const imageElement: any = cropperRef?.current;
        const cropper: any = imageElement?.cropper;

        if (
            width < GlobalConstants.UploadImg.minWidth ||
            height < GlobalConstants.UploadImg.minHeight ||
            width > GlobalConstants.UploadImg.maxWidth ||
            height > GlobalConstants.UploadImg.maxHeight
        ) {
            cropper.setData({
                width: Math.max(
                    GlobalConstants.UploadImg.minWidth,
                    Math.min(GlobalConstants.UploadImg.maxWidth, width)
                ),
                height: Math.max(
                    GlobalConstants.UploadImg.minHeight,
                    Math.min(GlobalConstants.UploadImg.maxHeight, height)
                ),
            });
        }
    };

    const setCroppedImg = () => {
        const imageElement: any = cropperRef?.current;
        const cropper: any = imageElement?.cropper;

        handleOnCrop(cropper.getCroppedCanvas()?.toDataURL());
    };

    const thrSetCroppedImg = throttle(setCroppedImg, 70);

    const onCrop = (e: Cropper.CropEvent<HTMLImageElement>) => {
        setMinSize(e);
        thrSetCroppedImg();
    };

    return (
        <>
            <Row gutter={[0, 20]} justify="center">
                <Col span={24}>
                    <Radio.Group defaultValue={ratio} buttonStyle="solid" onChange={handleChange}>
                        <Radio.Button value={16 / 9}>16:9</Radio.Button>
                        <Radio.Button value={4 / 3}>4:3</Radio.Button>
                        <Radio.Button value={1 / 1}>1:1</Radio.Button>
                        <Radio.Button value={2 / 3}>2:3</Radio.Button>
                        <Radio.Button value={'NaN'}>свободная</Radio.Button>
                    </Radio.Group>
                </Col>
                <Col span={24}>
                    <Cropper
                        style={{ maxHeight: `calc(100dvh - 250px)`}}
                        src={img}
                        viewMode={2}
                        aspectRatio={ratio}
                        autoCropArea={1}
                        onInitialized={(instance) => {
                            setCropper(instance);
                        }}
                        crop={onCrop}
                        ref={cropperRef}
                    />
                </Col>
            </Row>
        </>
    );
};

export { ImgCropper };
