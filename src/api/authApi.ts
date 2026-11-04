const BASE_URL = 'http://192.168.0.20:8000';
export const signupUser = async (userData: any) => {
    const payload = {
        name: userData.name.trim(),
        username: userData.username.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,

        address:{
            street: userData.street,
            suite: userData.suite,
            city: userData.city,
            zipcode: userData.zipcode,
        
        geo:{
            lat: userData.lat,
            lng: userData.lng,
        },
    },
        phone: userData.phone,
        website: userData.website,
        company:{
            name: userData.company_name,
            catchPhrase: userData.catchPhrase,
            bs: userData.bs,
        },
    };
    console.log('Signup payload:', payload);
    
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((err: any) =>
          `${err.loc.join('.')}: ${err.msg}`
        ).join('\n')
      : data.detail || 'Registration failed';
    throw new Error(message);
  }
  return data;
};

export const loginUser = async(email: string, password: string) =>{
    const response = await fetch(`${BASE_URL}/auth/login`,{
        method:'POST',
        headers:{
            'Content-Type':'application/json',
        },
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
        }),
    });
    const data = await response.json();

    if(!response.ok){
        throw new Error(
            typeof data.detail === 'string'?
            data.detail:"Login falied. Please check your credentials.",
        );
    }
    return data;
}