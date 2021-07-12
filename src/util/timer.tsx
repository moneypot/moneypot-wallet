import React, { Component } from 'react';
import { Button } from 'reactstrap';

export default class Timer extends Component<{ p: number }, { seconds: number; minutes: number; hours: number; days: number }> {
  public difference: number;
  constructor(props: { p: number }) {
    super(props);
    this.difference = +new Date(this.props.p) - +new Date();
    this.state = {
      days: Math.floor(this.difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((this.difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((this.difference / 1000 / 60) % 60),
      seconds: Math.floor((this.difference / 1000) % 60),
    };
  }
  myInterval: any;

  componentDidMount() {
    this.myInterval = setInterval(() => {
      const { seconds, minutes, hours, days } = this.state;

      if (seconds <= 0 && minutes <= 0 && hours <= 0 && days <= 0) {
        return;
      }
      if (seconds > 0) {
        this.setState(({ seconds }) => ({
          seconds: seconds - 1,
        }));
      }
      if (seconds === 0) {
        if (minutes === 0 && hours === 0 && days === 0) {
          clearInterval(this.myInterval);
        }
        // reverse order 
        else if (hours === 0 && minutes === 0 && seconds === 0) {
          this.setState(({ days }) => ({
            days: days - 1,
            hours: 23,
            minutes: 59,
            seconds: 59,
          }));
        }  
        else if (minutes === 0 && seconds === 0 ) {
          this.setState(({ hours }) => ({
            hours: (hours - 1) >= 0 ? (hours - 1) : 23,
            days: (hours - 1) < 0 ? (days - 1) : days,
            minutes: 59,
            seconds: 59,
          }));
        }
        else if (seconds === 0) {
          this.setState(({ minutes }) => ({
            minutes: (minutes - 1) >= 0 ? (minutes - 1) : 59,
            hours: (minutes - 1) < 0 ? (hours - 1) : hours,
            seconds: 59,
          }));
        } 
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.myInterval);
  }

  render() {
    const { days, hours, minutes, seconds } = this.state;
    const hasEnded = days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0;
    let Tcolor: string | undefined;
    if (!hasEnded) {
      Tcolor = (minutes < 10 && hours === 0 && days === 0) ? 'danger' : 'info';
    }

    const hourglass = () => {
      if (minutes > 30 ) { 
       return <i className="fad fa-hourglass-start" /> // more than 30 minutes = ok? 
      }
      if (minutes <= 30 && hours >= 1) { 
       return <i className="fad fa-hourglass-start" /> // less than 30 min, but more than 1 hour, = ok
      }
      if (minutes < 30 && hours <= 0 && days === 0) { 
        return <i className="fad fa-hourglass-half" /> // less than 30 minutes
      }
      if (minutes <= 10 && hours <= 0 && days === 0) { 
        <i className="fad fa-hourglass-end" />
      }
      return <i className="fad fa-hourglass-start" />
    };

    return (
      <div>
        {hasEnded ? (
          <Button color={'danger'}> {hourglass()} Time's up! </Button>
        ) : (
          <Button color={Tcolor}>
            {' '}
            {hourglass()} {days} days : {hours} hours : {minutes} minutes : {seconds} seconds
          </Button>
        )}
      </div>
    );
  }
}
