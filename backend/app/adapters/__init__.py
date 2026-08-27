from app.adapters.base import AuthorityAdapter, AdapterResult, AuthorityRegistry, registry
from app.adapters.sandbox import AuthoritySandboxAdapter
from app.adapters.sampark import RajasthanSamparkAdapter
from app.adapters.swachhata import SwachhataMohuaAdapter
from app.adapters.cpgrams import CPGRAMSAdapter
from app.adapters.email import VerifiedInstitutionalEmailAdapter

# Initialize and register all adapters into the global registry
registry.register("SANDBOX_SIMULATOR", AuthoritySandboxAdapter())
registry.register("RAJ_SAMPARK", RajasthanSamparkAdapter())
registry.register("SWACHHATA_MOHUA", SwachhataMohuaAdapter())
registry.register("CPGRAMS_CENTRAL", CPGRAMSAdapter())
registry.register("VERIFIED_EMAIL_FALLBACK", VerifiedInstitutionalEmailAdapter())

__all__ = [
    "AuthorityAdapter",
    "AdapterResult",
    "AuthorityRegistry",
    "registry",
    "AuthoritySandboxAdapter",
    "RajasthanSamparkAdapter",
    "SwachhataMohuaAdapter",
    "CPGRAMSAdapter",
    "VerifiedInstitutionalEmailAdapter",
]
