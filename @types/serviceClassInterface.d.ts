export interface ServiceClass {
  cli: () => Promise<boolean|undefined|void>
}