import {NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    const requestUrl = new URL(request.url);
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");

    let next = requestUrl.searchParams.get("next") ?? "/profile";
    if(!next.startsWith("/") || next.startsWith("//") ){
        next = "/profile";
    }

    if(tokenHash && type){
        const { error} = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type:  type as "invite"
        });

        if(!error){
            return NextResponse.redirect(new URL(next, requestUrl.origin))
        }
    }
return NextResponse.redirect(new URL("/auth/error", requestUrl.origin))

}