type FCWithChildren<T = object> = React.FC<{
  children?: React.ReactNode[]|React.ReactNode
} & T>