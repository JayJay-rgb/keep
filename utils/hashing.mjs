import bcrypt from "bcrypt"


export const hashPassword=(password)=>{
    const hashPassword=bcrypt.hashSync(password,10)
    return hashPassword
}

export const comparePassword = (passowrd,hashPassword)=>{
    return bcrypt.compareSync(passowrd,hashPassword)
}