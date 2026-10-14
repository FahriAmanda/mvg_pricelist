import { defineEventHandler, readBody, createError } from 'h3'

const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username dan password wajib diisi'
    })
  }

  try {
    // 1. Call BE_MVG /api/auth/login
    const loginRes = await fetch(`${BE_MVG_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: String(username).trim(),
        password: String(password),
        client_type: 'web'
      })
    })

    const loginData = await loginRes.json().catch(() => null)

    if (!loginRes.ok || !loginData || loginData.status !== 'success') {
      const errMsg = loginData?.message || 'Username atau password salah'
      throw createError({
        statusCode: loginRes.status === 401 ? 401 : 400,
        statusMessage: errMsg
      })
    }

    const token = loginData.token
    const rawUser = loginData.data?.user || {}

    // 2. Fetch user_default details from BE_MVG to get full name and profile
    let fullUser = {
      id: rawUser.id,
      username: rawUser.username,
      name: rawUser.name || rawUser.username,
      email: rawUser.email || null,
      roleName: 'User MVG',
      unitBisnis: null
    }

    try {
      const detailRes = await fetch(
        `${BE_MVG_URL}/api/dynamic/user_default/${rawUser.id}?include=user_detail%3Em_respo%3Em_unit_bisnis%2Cuser_detail%3Em_respo%3Em_respo_d%3Em_role%3Em_role_d%3Em_menu%2Cm_general&no_pagination=true`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      )

      if (detailRes.ok) {
        const detailData = await detailRes.json()
        const u = detailData.data || {}
        const tipeName = u.tipe?.value1 || u.tipe_user_name || null

        // Extract primary role or unit bisnis if available
        let unitName: string | null = null
        if (Array.isArray(u.user_details) && u.user_details.length > 0) {
          const primaryDetail = u.user_details.find((d: any) => d.is_primary) || u.user_details[0]
          unitName = primaryDetail?.m_respo?.unit_bisnis?.nama_comp || primaryDetail?.m_respo?.nama || null
        }

        fullUser = {
          id: u.id || rawUser.id,
          username: u.username || rawUser.username,
          name: u.nama_lengkap || u.name || rawUser.name || rawUser.username,
          email: u.email || rawUser.email || null,
          roleName: tipeName || 'Mitra Visual Group',
          unitBisnis: unitName
        }
      }
    } catch (detailErr) {
      console.warn('[auth/login] Could not fetch detailed user profile, using basic profile', detailErr)
    }

    return {
      status: 'success',
      token,
      user: fullUser
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('[auth/login] Error connecting to BE_MVG:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal terhubung ke server autentikasi BE_MVG'
    })
  }
})
