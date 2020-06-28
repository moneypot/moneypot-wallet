import React, { useState } from 'react';
import { Tooltip } from 'reactstrap';

// @ts-ignore
import TimeAgo from 'javascript-time-ago';

// @ts-ignore
import en from 'javascript-time-ago/locale/en';
import useUniqueId from './use-unique-id';

TimeAgo.locale(en);

const timeAgo = new TimeAgo('en-US');

type Props = {
  date: Date;
};

export default function Timeago({ date }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const uniqueId = useUniqueId();

  const toggle = () => setTooltipOpen(!tooltipOpen);
  return (
    <div>
      <div style={{ textDecoration: 'underline' }} id={uniqueId}>
        {timeAgo.format(date)}
      </div>
      <Tooltip placement="top" isOpen={tooltipOpen} target={uniqueId} toggle={toggle}>
        {date.toISOString()}
      </Tooltip>
    </div>
  );
}
