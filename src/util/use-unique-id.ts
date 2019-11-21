import { useState } from 'react';

let counter = 0;

export default function useUniqueId() {
    let [id, _] = useState(`unique_id_${counter++}`);
    return id;
}