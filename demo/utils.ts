import * as Hilo3d from 'hilo3d';

export function quat(x: number, y: number, z: number): number[] {
  x = Hilo3d.math.degToRad(x);
  y = Hilo3d.math.degToRad(y);
  z = Hilo3d.math.degToRad(z);
  const euler = new Hilo3d.Euler(x, y, z);
  return new Hilo3d.Quaternion().fromEuler(euler).toArray();
}

export function quatX(v: number) {
  return quat(v, 0, 0);
}

export function quatY(v: number) {
  return quat(0, v, 0);
}

export function quatZ(v: number) {
  return quat(0, 0, v);
}
