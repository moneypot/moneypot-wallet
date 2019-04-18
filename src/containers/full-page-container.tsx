import React from 'react';
import './full-page-container.scss';


export default function FullPageContainer(props: any) {


    return (
        <div className="full-page-container">
            {props.children}
        </div>
    );

}
