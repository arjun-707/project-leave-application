import React, { Component } from "react";

export class ListComponent extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            
            <div>
                {
                    this.props.list.map(u => {
                        console.log('dsjfhsdkf')
                        return u.email;
                    })
                }
            </div>
        )
    }
}