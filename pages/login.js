import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function LoginPage() {

const router = useRouter();

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [showPassword,setShowPassword] = useState(false);
const [loading,setLoading] = useState(false);
const [errorMsg,setErrorMsg] = useState("");

const handleLogin = async (e) => {

e.preventDefault();
setLoading(true);
setErrorMsg("");

const { error } = await supabase.auth.signInWithPassword({
email,
password
});

if(error){
setErrorMsg(error.message);
setLoading(false);
return;
}

router.push("/vendor-dashboard");

};

return (

<div style={{
maxWidth:"420px",
margin:"60px auto",
padding:"25px",
border:"1px solid #ddd",
borderRadius:"8px",
fontFamily:"Arial"
}}>

<h1 style={{textAlign:"center",marginBottom:"25px"}}>
Vendor Login
</h1>

{errorMsg && (
<p style={{
color:"red",
marginBottom:"20px",
textAlign:"center"
}}>
{errorMsg}
</p>
)}

<form onSubmit={handleLogin} style={{
display:"flex",
flexDirection:"column",
gap:"15px"
}}>

<label>Email</label>

<input
type="email"
placeholder="Enter email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
style={{
padding:"10px",
borderRadius:"4px",
border:"1px solid #ccc"
}}
/>

<label>Password</label>

<div style={{display:"flex"}}>

<input
type={showPassword ? "text" : "password"}
placeholder="Enter password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
style={{
flex:1,
padding:"10px",
borderRadius:"4px",
border:"1px solid #ccc"
}}
/>

<button
type="button"
onClick={()=>setShowPassword(!showPassword)}
style={{
marginLeft:"8px",
padding:"10px"
}}
>
{showPassword ? "Hide" : "Show"}
</button>

</div>

<button
type="submit"
disabled={loading}
style={{
padding:"12px",
width:"100%",
background:"#2563eb",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer"
}}
>

{loading ? "Logging in..." : "Login"}

</button>

</form>

</div>

);

}
