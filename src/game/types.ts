

export const enum Direction {

    None = -1,
    Right = 0,
    Up = 1,
    Left = 2,
    Down = 3
};


export const oppositeDirection = (dir : Direction) => 
    [Direction.Left, Direction.Down, Direction.Right, Direction.Up] [dir];
