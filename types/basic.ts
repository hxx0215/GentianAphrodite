
import {Router} from 'npm:express'

export type Prompt= {
  text:{
    content: string;
    important: number
  }[]
}
export type Stat = {
  username: string;
  charname: string;
  state:{
    init_count: number;
    last_start_time_stamp: number;
    start_count: number;
  }
  router: Router;
};