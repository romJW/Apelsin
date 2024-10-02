import {Progress} from "antd";
import {useEffect, useState} from "react";

type TProps = {
    message: string,
    type: string,
    duration: number,
};

type TColor = {
    bgColor: string,
    strokeColor: string,
}

const Notification = (({message, type, duration}: TProps): JSX.Element => {
    const [miliSeconds, setMiliSeconds] = useState(0);
    const [color, setColor] = useState<TColor>({
        bgColor: '#8d8d8d',
        strokeColor: '#565656',
    });

    useEffect(() => {
        switch(type) {
            case 'error':
                setColor(() => {
                    return {
                        bgColor: '#ff9393', strokeColor: '#ff0000'
                    }
                });
                break;
            case 'info':
                setColor(() => {
                    return {
                        bgColor: '#76b6ff',
                        strokeColor: '#0d7dfd',
                    }
                });
                break;
            case 'success':
                setColor(() => {
                    return {
                        bgColor: '#00dd2b',
                        strokeColor: '#007c18',
                    }
                });
                break;
            default:
                setColor(() => {
                    return {
                        bgColor: '#8d8d8d',
                        strokeColor: '#565656',
                    }
                });
                break;
        }
        const timer = setInterval((delay) => {
            setMiliSeconds((prev) => {
                prev += delay;
                return prev;
            })
        }, 10, 10);

        setTimeout(() => {
            clearInterval(timer);
        }, duration * 1000);
    }, [])

    return (
        <>
            <Progress strokeLinecap={'butt'} strokeColor={color.strokeColor} trailColor={color.bgColor} className={'progressNotification'} showInfo={false} size={'small'} percent={miliSeconds * 100 / (duration * 1000)}></Progress>
            <span>{message}</span>
        </>
    )
});

export {Notification};
