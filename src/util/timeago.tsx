import React, { useState } from 'react';
import { Tooltip } from 'reactstrap';

// @ts-ignore
import TimeAgo from 'javascript-time-ago';

// @ts-ignore
import en from 'javascript-time-ago/locale/en';

TimeAgo.locale(en);

const timeAgo = new TimeAgo('en-US');

type Props = {
  date: Date;
};

export default function Timeago({ date }: Props) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const toggle = () => setTooltipOpen(!tooltipOpen);
  // on hover it returns all tooltips. todo: dynid or just remove
  return (
    <div>
      <div style={{ textDecoration: 'underline' }} id="TooltipExample">
        {timeAgo.format(date)}
      </div>
      {/* <Tooltip placement="top" isOpen={tooltipOpen} target="TooltipExample" toggle={toggle}>
        {date.toISOString()}
      </Tooltip> */}
    </div>
  );
}
